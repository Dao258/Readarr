using System.Collections.Generic;
using System.Linq;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using NzbDrone.Core.Books;
using NzbDrone.Core.MediaFiles;
using NzbDrone.Core.Organizer;
using NzbDrone.Core.Qualities;
using NzbDrone.Core.Test.Framework;

namespace NzbDrone.Core.Test.OrganizerTests.FileNameBuilderTests
{
    [TestFixture]
    public class TitleTheFixture : CoreTest<FileNameBuilder>
    {
        private Author _author;
        private Book _book;
        private Edition _edition;
        private BookFile _trackFile;
        private NamingConfig _namingConfig;

        [SetUp]
        public void Setup()
        {
            _author = Builder<Author>
                    .CreateNew()
                    .With(s => s.Name = "Alien Ant Farm")
                    .Build();

            var series = Builder<Series>
                .CreateNew()
                .With(x => x.Title = "Series Title")
                .Build();

            var seriesLink = Builder<SeriesBookLink>
                .CreateListOfSize(1)
                .All()
                .With(s => s.Position = "1-2")
                .With(s => s.Series = series)
                .BuildListOfNew();

            _book = Builder<Book>
                    .CreateNew()
                    .With(s => s.Title = "Anthology")
                    .With(s => s.AuthorMetadata = _author.Metadata.Value)
                    .With(s => s.SeriesLinks = seriesLink)
                    .Build();

            _edition = Builder<Edition>
                .CreateNew()
                .With(s => s.Title = _book.Title)
                .With(s => s.Book = _book)
                .Build();

            _trackFile = new BookFile { Quality = new QualityModel(Quality.MP3), ReleaseGroup = "ReadarrTest" };

            _namingConfig = NamingConfig.Default;
            _namingConfig.RenameBooks = true;

            Mocker.GetMock<INamingConfigService>()
                  .Setup(c => c.GetConfig()).Returns(_namingConfig);

            Mocker.GetMock<IQualityDefinitionService>()
                .Setup(v => v.Get(Moq.It.IsAny<Quality>()))
                .Returns<Quality>(v => Quality.DefaultQualityDefinitions.First(c => c.Quality == v));
        }

        [TestCase("The Mist", "Mist, The")]
        [TestCase("A Place to Call Home", "Place to Call Home, A")]
        [TestCase("An Adventure in Space and Time", "Adventure in Space and Time, An")]
        [TestCase("The Flash (2010)", "Flash, The (2010)")]
        [TestCase("A League Of Their Own (AU)", "League Of Their Own, A (AU)")]
        [TestCase("The Fixer (ZH) (2015)", "Fixer, The (ZH) (2015)")]
        [TestCase("The Sixth Sense 2 (Thai)", "Sixth Sense 2, The (Thai)")]
        [TestCase("The Amazing Race (Latin America)", "Amazing Race, The (Latin America)")]
        [TestCase("The Rat Pack (A&E)", "Rat Pack, The (A&E)")]
        [TestCase("The Climax: I (Almost) Got Away With It (2016)", "Climax- I (Almost) Got Away With It, The (2016)")]

        //[TestCase("", "")]
        public void should_get_expected_title_back(string name, string expected)
        {
            _author.Name = name;
            _namingConfig.StandardBookFormat = "{Author NameThe}";

            Subject.BuildBookFileName(_author, _edition, _trackFile)
                   .Should().Be(expected);
        }

        [TestCase("A")]
        [TestCase("Anne")]
        [TestCase("Theodore")]
        [TestCase("3%")]
        public void should_not_change_title(string name)
        {
            _author.Name = name;
            _namingConfig.StandardBookFormat = "{Author NameThe}";

            Subject.BuildBookFileName(_author, _edition, _trackFile)
                   .Should().Be(name);
        }
    }
}
